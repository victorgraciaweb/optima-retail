import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialIncidentsSchema1794332135734 implements MigrationInterface {
  name = 'InitialIncidentsSchema1794332135734';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Required by the uuid_generate_v4() defaults below. Added by hand:
    // TypeORM emits the function call but never the extension that provides it.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "incident_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "incident_id" uuid NOT NULL, "author_name" character varying(120) NOT NULL, "body" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a17275da5243738996bbba7327d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incident_comments_incident_created_at" ON "incident_comments" ("incident_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incident_logs_action_enum" AS ENUM('created', 'status_changed', 'reopened', 'commented', 'consistency_fix')`,
    );
    await queryRunner.query(
      `CREATE TABLE "incident_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "incident_id" uuid NOT NULL, "action" "public"."incident_logs_action_enum" NOT NULL, "old_value" character varying(40), "new_value" character varying(40), "user_name" character varying(120) NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f727a033fe9430876dff0510752" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incident_logs_incident_created_at" ON "incident_logs" ("incident_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidents_status_enum" AS ENUM('abierta', 'en_revision', 'bloqueada', 'resuelta')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."incidents_priority_enum" AS ENUM('baja', 'media', 'alta', 'critica')`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'optima_retail_db',
        'public',
        'incidents',
        'GENERATED_COLUMN',
        'search_vector',
        "to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, ''))",
      ],
    );
    await queryRunner.query(
      `CREATE TABLE "incidents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(180) NOT NULL, "description" text NOT NULL, "status" "public"."incidents_status_enum" NOT NULL DEFAULT 'abierta', "priority" "public"."incidents_priority_enum" NOT NULL DEFAULT 'media', "requester_name" character varying(120) NOT NULL, "assigned_to" character varying(120), "due_at" TIMESTAMP WITH TIME ZONE, "needs_review" boolean NOT NULL DEFAULT false, "review_reason" text, "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incidents_created_at" ON "incidents" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incidents_priority" ON "incidents" ("priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incidents_status" ON "incidents" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incidents_status_priority" ON "incidents" ("status", "priority") `,
    );
    // Added by hand: TypeORM only emits btree indexes, and a tsvector column
    // is useless without GIN — the free-text filter would sequentially scan.
    await queryRunner.query(
      `CREATE INDEX "idx_incidents_search_vector" ON "incidents" USING GIN ("search_vector")`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_comments" ADD CONSTRAINT "FK_5575c3f58b513060955586187ea" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_logs" ADD CONSTRAINT "FK_93068cc13e2bd3f86b3bf7d823c" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "incident_logs" DROP CONSTRAINT "FK_93068cc13e2bd3f86b3bf7d823c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "incident_comments" DROP CONSTRAINT "FK_5575c3f58b513060955586187ea"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_incidents_search_vector"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_incidents_status_priority"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_incidents_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_incidents_priority"`);
    await queryRunner.query(`DROP INDEX "public"."idx_incidents_created_at"`);
    await queryRunner.query(`DROP TABLE "incidents"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'search_vector',
        'optima_retail_db',
        'public',
        'incidents',
      ],
    );
    await queryRunner.query(`DROP TYPE "public"."incidents_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."incidents_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_incident_logs_incident_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "incident_logs"`);
    await queryRunner.query(`DROP TYPE "public"."incident_logs_action_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_incident_comments_incident_created_at"`,
    );
    await queryRunner.query(`DROP TABLE "incident_comments"`);
  }
}
