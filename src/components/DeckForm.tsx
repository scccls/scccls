
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@/components/ui/switch";
import { Deck } from "@/types/StudyTypes";

const deckFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  availableForPracticeTest: z.boolean().default(false),
  isPastPaper: z.boolean().default(false),
});

type DeckFormData = z.infer<typeof deckFormSchema>;

interface DeckFormProps {
  onSubmit: (data: DeckFormData) => void;
  defaultValues?: Partial<DeckFormData>;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

const DeckForm: React.FC<DeckFormProps> = ({
  onSubmit,
  defaultValues = {},
  isSubmitting = false,
  isEdit = false,
}) => {
  const form = useForm<DeckFormData>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      title: "",
      description: "",
      availableForPracticeTest: false,
      isPastPaper: false,
      ...defaultValues,
    },
  });

  // Watch isPastPaper to auto-enable practice test
  const isPastPaper = form.watch("isPastPaper");
  
  React.useEffect(() => {
    if (isPastPaper) {
      form.setValue("availableForPracticeTest", true);
    }
  }, [isPastPaper, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter deck title" {...field} />
              </FormControl>
              <FormDescription>
                Give your deck a clear, descriptive name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this deck is about"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description to help remember what's in this deck.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availableForPracticeTest"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Available for Practice Tests
                </FormLabel>
                <FormDescription>
                  Allow this deck to appear in practice test options
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPastPaper}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPastPaper"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Past Paper
                </FormLabel>
                <FormDescription>
                  Questions will be presented in order (not randomized). Automatically enables practice tests.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? "Update Deck" : "Create Deck"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DeckForm;
