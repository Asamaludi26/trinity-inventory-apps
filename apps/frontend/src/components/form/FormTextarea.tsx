import { type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface FormTextareaProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export function FormTextarea<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  rows = 3,
  disabled,
  className,
}: FormTextareaProps<T>) {
  const error = form.formState.errors[name];

  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        {...form.register(name)}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error.message as string}</p>}
    </div>
  );
}
