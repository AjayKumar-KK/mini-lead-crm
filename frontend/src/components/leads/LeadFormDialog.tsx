import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateLead, useUpdateLead } from "@/hooks/useLeads";
import type { Lead } from "@/lib/types";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phone: z.string().trim().optional().or(z.literal("")),
  source: z.string().trim().optional().or(z.literal("")),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass an existing lead to edit; omit to create. */
  lead?: Lead;
  onSuccess?: (lead: Lead) => void;
}

export function LeadFormDialog({ open, onOpenChange, lead, onSuccess }: Props) {
  const isEdit = !!lead;
  const createMutation = useCreateLead({
    onSuccess: (l) => {
      onSuccess?.(l);
      onOpenChange(false);
    },
  });
  const updateMutation = useUpdateLead({
    onSuccess: (l) => {
      onSuccess?.(l);
      onOpenChange(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    mode: "onChange",
    defaultValues: {
      name: lead?.name ?? "",
      email: lead?.email ?? "",
      phone: lead?.phone ?? "",
      source: lead?.source ?? "",
    },
  });

  // When the dialog re-opens for a different lead, sync defaults.
  useEffect(() => {
    if (open) {
      reset({
        name: lead?.name ?? "",
        email: lead?.email ?? "",
        phone: lead?.phone ?? "",
        source: lead?.source ?? "",
      });
    }
  }, [open, lead, reset]);

  const submitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = handleSubmit((values) => {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() || null,
      source: values.source?.trim() || null,
    };
    if (isEdit && lead) {
      updateMutation.mutate({ id: lead.id, input: payload });
    } else {
      createMutation.mutate(payload);
    }
  });

  // Surface a server-side error (e.g., 422 from the mock) as a friendly message at the top.
  const serverError =
    (createMutation.error as { serverMessage?: string } | null)?.serverMessage ??
    (updateMutation.error as { serverMessage?: string } | null)?.serverMessage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lead" : "Create lead"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update lead details. Status is changed separately."
              : "Add a new lead to the pipeline. It starts as NEW."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          {serverError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="lead-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lead-name"
              autoFocus
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "lead-name-err" : undefined}
              placeholder="Jane Doe"
              {...register("name")}
            />
            {errors.name && (
              <p id="lead-name-err" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="lead-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lead-email"
              type="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "lead-email-err" : undefined}
              placeholder="jane@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p id="lead-email-err" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="lead-phone">Phone</Label>
              <Input id="lead-phone" placeholder="+1 555 0100" {...register("phone")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lead-source">Source</Label>
              <Input id="lead-source" placeholder="website" {...register("source")} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || (isEdit && !isDirty) || submitting}
              aria-busy={submitting}
            >
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
