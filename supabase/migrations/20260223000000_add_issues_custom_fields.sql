-- Migration: add custom_fields to issues table
-- Description: Supports dynamic spreadsheet columns for the Issues Register

ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
