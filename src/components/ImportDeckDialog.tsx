
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { useStudy } from "@/contexts/StudyContext";
import { useToast } from "@/hooks/use-toast";

interface ImportDeckDialogProps {
  children: React.ReactNode;
}

const ImportDeckDialog: React.FC<ImportDeckDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { importDeck } = useStudy();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to import.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileContent = await file.text();
      importDeck(fileContent);
      setOpen(false);
      setFile(null);
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to read the import file.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Deck</DialogTitle>
          <DialogDescription>
            Import a deck file (.json)
          </DialogDescription>
        </DialogHeader>

        <div className="grid w-full items-center gap-4 py-4">
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="deck-file"
              className="flex min-h-[6rem] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-muted/20 px-4 py-8 text-center"
            >
              <FileUp className="mb-2 h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">
                {file ? file.name : "Click here to upload a deck file"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Supported format: .json
              </div>
              <input
                id="deck-file"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file}>
            Import Deck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDeckDialog;
