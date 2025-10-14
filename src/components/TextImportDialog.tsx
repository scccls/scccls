import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useStudy } from "@/contexts/StudyContext";
import { parseTextToDeck, parsedDeckToJSON } from "@/utils/textToDeck";
import { FileText, ChevronDown, AlertCircle, CheckCircle2 } from "lucide-react";

export const TextImportDialog = () => {
  const [open, setOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ deckTitle: string; questionCount: number } | null>(null);
  const { importDeck } = useStudy();

  const exampleText = `My Biology Deck

What is the powerhouse of the cell?
* Mitochondria
Nucleus
Ribosome
Golgi apparatus

What is photosynthesis?
* The process by which plants convert light into energy
The process of cell division
The process of protein synthesis
The breakdown of glucose`;

  const handlePreview = () => {
    setError(null);
    setPreviewData(null);

    if (!textInput.trim()) {
      setError("Please enter some text to import");
      return;
    }

    try {
      const parsed = parseTextToDeck(textInput);
      setPreviewData({
        deckTitle: parsed.deck.title,
        questionCount: parsed.questions.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse text");
    }
  };

  const handleImport = () => {
    try {
      const parsed = parseTextToDeck(textInput);
      const jsonString = parsedDeckToJSON(parsed);
      importDeck(jsonString);
      
      // Reset and close
      setTextInput("");
      setError(null);
      setPreviewData(null);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import deck");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Quick Import from Text
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Deck from Text</DialogTitle>
          <DialogDescription>
            Paste your questions in a simple text format and we'll convert them to a deck
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Guide */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
              <ChevronDown className="h-4 w-4 transition-transform" />
              Format Guide & Example
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              <div className="rounded-md bg-muted p-4 text-sm space-y-2">
                <p className="font-medium">Format Rules:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>First line is the deck title</li>
                  <li>Each question starts on its own line (no special marker needed)</li>
                  <li>Mark the correct answer with an asterisk (*)</li>
                  <li>Wrong answers start with a dash (-) or no marker</li>
                  <li>Leave blank lines between questions for better readability (optional)</li>
                </ul>
                
                <p className="font-medium mt-4">Example:</p>
                <pre className="bg-background p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
{exampleText}
                </pre>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTextInput(exampleText)}
                  className="mt-2"
                >
                  Use This Example
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Text Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Paste Your Questions Here</label>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`${exampleText}`}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview Display */}
          {previewData && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Ready to import: <strong>{previewData.deckTitle}</strong> with{" "}
                <strong>{previewData.questionCount}</strong> question{previewData.questionCount !== 1 ? "s" : ""}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handlePreview}>
              Preview
            </Button>
            <Button onClick={handleImport} disabled={!previewData}>
              Import Deck
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
