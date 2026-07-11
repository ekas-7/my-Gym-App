import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconCheck } from "@/components/icons";

interface ExerciseItemProps {
  name: string;
  reps: string;
  sets: number;
  isCompleted?: boolean;
  onToggle: () => void;
}

export function ExerciseItem({ name, reps, sets, isCompleted, onToggle }: ExerciseItemProps) {
  return (
    <Button
      onClick={onToggle}
      variant={isCompleted ? "default" : "outline"}
      className="h-auto py-3 px-4 flex items-center justify-between w-full"
    >
      <div className="flex flex-col items-start gap-1">
        <span className="font-semibold text-sm">{name}</span>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{sets} sets</span>
          <span>•</span>
          <span>{reps} reps</span>
        </div>
      </div>
      {isCompleted && (
        <Badge variant="secondary" className="ml-2">
          <IconCheck size={12} />
        </Badge>
      )}
    </Button>
  );
}
