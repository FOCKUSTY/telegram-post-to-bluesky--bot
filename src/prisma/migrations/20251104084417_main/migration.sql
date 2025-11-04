/*
  Warnings:

  - You are about to drop the column `threadId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `postUrl` on the `Thread` table. All the data in the column will be lost.
  - Added the required column `cid` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uri` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cid` to the `Thread` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uri` to the `Thread` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_threadId_fkey";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "threadId",
ADD COLUMN     "cid" TEXT NOT NULL,
ADD COLUMN     "uri" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Thread" DROP COLUMN "postUrl",
ADD COLUMN     "cid" TEXT NOT NULL,
ADD COLUMN     "uri" TEXT NOT NULL;
