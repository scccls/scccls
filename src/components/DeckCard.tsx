
import React from "react";
import { Deck } from "@/types/StudyTypes";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, BookOpen, FileQuestion, FolderPlus, Edit, Trash2, FileUp } from "lucide-react";
import { useStudy } from "@/contexts/StudyContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface DeckCardProps {
  deck: Deck;
  onEdit: (deck: Deck) => void;
  onDelete: (deck: Deck, event?: React.MouseEvent) => void;
  onDrop?: (droppedDeckId: string, targetDeckId: string) => void;
  numQuestions: number;
  numSubdecks: number;
  averageScore: number;
}

const DeckCard: React.FC<DeckCardProps> = ({
  deck,
  onEdit,
  onDelete,
  onDrop,
  numQuestions,
  numSubdecks,
  averageScore,
}) => {
  const navigate = useNavigate();
  const { exportDeck, getTotalQuestionsCount } = useStudy();
  const [isDragOver, setIsDragOver] = React.useState(false);
  
  // Get total questions count including subdecks
  const totalQuestionsCount = getTotalQuestionsCount(deck.id);

  const handleViewDeck = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/deck/${deck.id}`);
  };

  const handleStudyDeck = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/study/${deck.id}`);
  };

  const handleAddSubdeck = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/deck/${deck.id}/add-subdeck`);
  };

  const handleEditDeck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(deck);
  };

  const handleDeleteDeck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(deck, e);
  };

  const handleExportDeck = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportDeck(deck.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", deck.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const droppedDeckId = e.dataTransfer.getData("text/plain");
    
    // Don't allow dropping a deck onto itself
    if (droppedDeckId === deck.id) return;
    
    if (onDrop && droppedDeckId) {
      onDrop(droppedDeckId, deck.id);
    }
  };

  return (
    <Card 
      className={`${deck.isSubdeck ? "subdeck-card" : "deck-card"} ${isDragOver ? "ring-2 ring-primary" : ""} cursor-move transition-all`} 
      onClick={handleViewDeck}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold">{deck.title}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-md bg-muted border border-border text-sm font-medium">
              Average Score: {averageScore.toFixed(2)}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleEditDeck}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddSubdeck}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Subdeck
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportDeck}>
                  <FileUp className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDeleteDeck}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {deck.description && (
          <CardDescription>{deck.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mt-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileQuestion className="h-3 w-3" />
            {numQuestions} questions
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <FolderPlus className="h-3 w-3" />
            {numSubdecks} subdecks
          </Badge>
          {totalQuestionsCount > numQuestions && (
            <Badge variant="outline" className="flex items-center gap-1 bg-muted/50">
              <FileQuestion className="h-3 w-3" />
              {totalQuestionsCount} total
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleViewDeck}>
          <BookOpen className="mr-2 h-4 w-4" />
          View
        </Button>
        <Button size="sm" onClick={handleStudyDeck} disabled={totalQuestionsCount === 0}>
          <FileQuestion className="mr-2 h-4 w-4" />
          Study
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DeckCard;
