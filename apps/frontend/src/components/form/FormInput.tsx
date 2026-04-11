import { type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormInputProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}

export function FormInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  disabled,
  className,
}: FormInputProps<T>) {
  const error = form.formState.errors[name];

  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...form.register(name)}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error.message as string}</p>}
    </div>
  );
}
