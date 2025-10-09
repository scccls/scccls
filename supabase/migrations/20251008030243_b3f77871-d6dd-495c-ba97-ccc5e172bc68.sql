-- Add column to control whether deck appears in practice test options
ALTER TABLE decks
ADD COLUMN available_for_practice_test boolean DEFAULT false;

-- Update existing decks to be available by default for backwards compatibility
UPDATE decks SET available_for_practice_test = false;