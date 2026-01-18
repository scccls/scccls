
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, FileText } from "lucide-react";
import { useStudy } from "@/contexts/StudyContext";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { parseTextToDeck } from "@/utils/textToDeck";

interface ImportDeckDialogProps {
  children: React.ReactNode;
}

const ImportDeckDialog: React.FC<ImportDeckDialogProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textError, setTextError] = useState("");
  const [textPreview, setTextPreview] = useState<{ title: string; questionCount: number } | null>(null);
  const { importDeck } = useStudy();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileImport = async () => {
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

  const handleTextPreview = () => {
    setTextError("");
    setTextPreview(null);

    if (!textInput.trim()) {
      setTextError("Please enter text to import");
      return;
    }

    try {
      const parsed = parseTextToDeck(textInput);
      setTextPreview({
        title: parsed.deck.title,
        questionCount: parsed.questions.length,
      });
    } catch (error) {
      setTextError(error instanceof Error ? error.message : "Failed to parse text");
    }
  };

  const handleTextImport = () => {
    try {
      const parsed = parseTextToDeck(textInput);
      const jsonString = JSON.stringify(parsed, null, 2);
      importDeck(jsonString);
      
      toast({
        title: "Success!",
        description: `Imported deck "${parsed.deck.title}" with ${parsed.questions.length} questions`,
      });
      
      setOpen(false);
      setTextInput("");
      setTextError("");
      setTextPreview(null);
    } catch (error) {
      setTextError(error instanceof Error ? error.message : "Failed to import deck");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Deck</DialogTitle>
          <DialogDescription>
            Choose how you want to import your deck
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">
              <FileUp className="mr-2 h-4 w-4" />
              Import by File
            </TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="mr-2 h-4 w-4" />
              Import by Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
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
              <Button onClick={handleFileImport} disabled={!file}>
                Import Deck
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-4">
              <Collapsible>
                <CollapsibleTrigger className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                  📖 View Format Guide & Example
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  <div className="rounded-md bg-muted p-3 text-sm space-y-2">
                    <p className="font-medium">Format Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>First line: Deck title</li>
                      <li>Each question on its own line</li>
                      <li>Mark correct answers with * (asterisk)</li>
                      <li>Other options without any marker</li>
                      <li>Blank line between questions</li>
                    </ul>
                    <p className="font-medium mt-3">Example:</p>
                    <pre className="bg-background p-2 rounded text-xs whitespace-pre-wrap">
{`Introduction

What year was SLSA established?
* 1907
1910
1895
1923

What is the main purpose of SLSA?
* Beach safety
Surfing competitions
Beach cleaning
Lifeguard training`}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Textarea
                placeholder="Paste your deck text here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />

              {textError && (
                <Alert variant="destructive">
                  <AlertDescription>{textError}</AlertDescription>
                </Alert>
              )}

              {textPreview && (
                <Alert>
                  <AlertDescription>
                    ✅ Ready to import: <strong>{textPreview.title}</strong> with {textPreview.questionCount} question{textPreview.questionCount !== 1 ? 's' : ''}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleTextPreview}>
                Preview
              </Button>
              <Button onClick={handleTextImport} disabled={!textInput.trim()}>
                Import Deck
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDeckDialog;
