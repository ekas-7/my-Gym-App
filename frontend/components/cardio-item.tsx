import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface CardioItemProps {
  name: string;
  duration: number;
  isCompleted?: boolean;
  onToggle: () => void;
}

export function CardioItem({ name, duration, isCompleted, onToggle }: CardioItemProps) {
  return (
    <Button
      onClick={onToggle}
      variant={isCompleted ? "default" : "outline"}
      className="h-auto py-3 px-4 flex items-center justify-between w-full"
    >
      <div className="flex flex-col items-start gap-1">
        <span className="font-semibold text-sm">{name}</span>
        <span className="text-xs text-muted-foreground">{duration} minutes</span>
      </div>
      {isCompleted && (
        <Badge variant="secondary" className="ml-2">
          <Check className="h-3 w-3" />
        </Badge>
      )}
    </Button>
  );
}
