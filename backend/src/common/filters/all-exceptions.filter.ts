import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/** Postgres error codes that have a meaningful HTTP translation. */
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_UNIQUE_VIOLATION = '23505';

interface DriverError {
  code?: string;
  detail?: string;
}

/**
 * Single place where any unhandled error becomes an HTTP response.
 *
 * Without it, two things leak to the client: a database driver error turns into
 * an opaque 500 (a foreign key violation is a client mistake, not a server
 * failure), and the raw Postgres message — table names, column names, row
 * values — is returned verbatim. Services therefore never wrap their writes in
 * try/catch just to translate errors; they let the error bubble up here.
 *
 * Domain exceptions (`NotFoundException`, `ConflictException`, validation
 * errors from the global `ValidationPipe`) already carry the right status and a
 * message written for the user, so they are re-emitted untouched.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    // Already an intentional HTTP response: keep status and body as they are.
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof QueryFailedError) {
      const { code, detail } = exception.driverError as DriverError;

      if (code === PG_FOREIGN_KEY_VIOLATION) {
        this.logger.warn(
          `${request.method} ${request.url} — foreign key violation: ${detail ?? exception.message}`,
        );
        response.status(HttpStatus.BAD_REQUEST).json({
          message:
            'La operación referencia un registro que no existe o que está en uso.',
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        });
        return;
      }

      if (code === PG_UNIQUE_VIOLATION) {
        this.logger.warn(
          `${request.method} ${request.url} — unique violation: ${detail ?? exception.message}`,
        );
        response.status(HttpStatus.CONFLICT).json({
          message: 'El registro ya existe.',
          error: 'Conflict',
          statusCode: HttpStatus.CONFLICT,
        });
        return;
      }
    }

    // Anything else is a bug or an infrastructure failure: log it in full for
    // diagnosis and return a message that reveals nothing about the internals.
    this.logger.error(
      `${request.method} ${request.url} — unhandled exception`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Error interno del servidor. Revise los logs del servidor.',
      error: 'Internal Server Error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
