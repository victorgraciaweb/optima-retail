import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

/**
 * ExceptionHandlerService
 *
 * Centralized service to handle and rethrow exceptions in a consistent way.
 * Useful for services or repositories to standardize error responses.
 */
@Injectable()
export class ExceptionHandlerService {
  /**
   * Handle and rethrow exceptions
   *
   * - Logs the original error to the console
   * - Converts database or known exceptions into proper HTTP exceptions
   * - Throws InternalServerErrorException for unknown errors
   *
   * @param error The caught error
   * @throws Appropriate HTTP exception
   */
  handleExceptions(error: any): never {
    // Log the original error for debugging
    console.error(error);

    // Handle unique constraint violations (Postgres code 23505)
    if (error.code === '23505') {
      const detail = error.detail || 'Duplicate entry';
      throw new BadRequestException(`Duplicate entry error: ${detail}`);
    }

    // Re-throw NotFoundException as-is
    if (error instanceof NotFoundException) {
      throw error;
    }

    // Handle explicit HTTP conflict responses
    if (error.response && error.response.status === 409) {
      throw new ConflictException('Conflict occurred with the request');
    }

    // Fallback for unexpected errors
    throw new InternalServerErrorException(
      'An unexpected error occurred - Check server logs for details',
    );
  }
}
