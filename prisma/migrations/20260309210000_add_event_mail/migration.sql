CREATE TABLE "EventMail" (
  "id"             TEXT NOT NULL,
  "eventId"        TEXT NOT NULL,
  "purpose"        TEXT NOT NULL,
  "subject"        TEXT NOT NULL,
  "body"           TEXT NOT NULL,
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "sentAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EventMail_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventMail_eventId_idx" ON "EventMail"("eventId");

ALTER TABLE "EventMail" ADD CONSTRAINT "EventMail_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
