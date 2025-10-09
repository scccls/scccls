
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Question } from "@/types/StudyTypes";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
});

const questionFormSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  correctOptionId: z.string().min(1, "Please select a correct answer"),
  options: z.array(optionSchema).min(2, "At least 2 options are required"),
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

interface QuestionFormProps {
  onSubmit: (data: QuestionFormData) => void;
  defaultValues?: Partial<Question>;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  isEdit = false,
}) => {
  // Create 4 default options if no defaultValues are provided
  const createDefaultOptions = () => {
    if (defaultValues?.options) {
      return defaultValues.options;
    }
    
    // Create 4 default empty options
    return [
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
      { id: crypto.randomUUID(), text: "" },
    ];
  };

  const [options, setOptions] = useState<{ id: string; text: string }[]>(createDefaultOptions());

  const [correctOptionId, setCorrectOptionId] = useState<string>(
    defaultValues?.correctOptionId || ""
  );

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: defaultValues?.text || "",
      correctOptionId: defaultValues?.correctOptionId || "",
      options: defaultValues?.options || [
        { text: "" },
        { text: "" },
        { text: "" },
        { text: "" },
      ],
    },
  });

  // This effect syncs the selected correct option with the form state
  useEffect(() => {
    if (correctOptionId) {
      form.setValue("correctOptionId", correctOptionId);
    }
  }, [correctOptionId, form]);

  const handleAddOption = () => {
    setOptions([...options, { id: crypto.randomUUID(), text: "" }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;

    const newOptions = [...options];
    const removedOption = newOptions.splice(index, 1)[0];

    // If the removed option was the correct one, reset correctOptionId
    if (removedOption.id === correctOptionId) {
      setCorrectOptionId("");
      form.setValue("correctOptionId", "");
    }

    setOptions(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
    
    // Update the form's options array
    form.setValue("options", newOptions.map(option => ({
      text: option.text
    })));
  };

  const handleCorrectOptionChange = (value: string) => {
    setCorrectOptionId(value);
    form.setValue("correctOptionId", value);
  };

  const handleSubmit = (data: any) => {
    // Validate that a correct option is selected
    if (!correctOptionId) {
      form.setError("correctOptionId", {
        type: "manual",
        message: "Please select a correct answer"
      });
      return;
    }

    // Validate that all options have text
    const hasEmptyOptions = options.some(option => !option.text.trim());
    if (hasEmptyOptions) {
      form.setError("options", {
        type: "manual",
        message: "All options must have text"
      });
      return;
    }

    // Transform the form data
    const formattedData = {
      text: data.text,
      correctOptionId: correctOptionId,
      options: options.map(option => ({
        id: option.id,
        text: option.text,
      })),
    };

    onSubmit(formattedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Question" : "Add Question"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your question"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Options</FormLabel>
              <FormDescription>
                Add at least 2 options and select the correct answer.
              </FormDescription>

              <RadioGroup
                value={correctOptionId}
                onValueChange={handleCorrectOptionChange}
                className="space-y-2"
              >
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <div className="flex-1">
                      <Input
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>

              {form.formState.errors.correctOptionId && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.correctOptionId.message}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={isSubmitting}>
                {isEdit ? "Update Question" : "Add Question"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
