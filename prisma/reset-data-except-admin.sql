PRAGMA foreign_keys = ON;
DELETE FROM "PersonnelDocument" WHERE "personnelId" IN (SELECT "id" FROM "Personnel" WHERE "nrp" <> 'ADMIN');
DELETE FROM "PersonnelStatus" WHERE "personnelId" IN (SELECT "id" FROM "Personnel" WHERE "nrp" <> 'ADMIN');
DELETE FROM "PersonnelAssignment" WHERE "personnelId" IN (SELECT "id" FROM "Personnel" WHERE "nrp" <> 'ADMIN');
DELETE FROM "Personnel" WHERE "nrp" <> 'ADMIN';
DELETE FROM "ImportBatch";
DELETE FROM "ReportGeneration";
DELETE FROM "BackupHistory";
DELETE FROM "ActivityLog";
