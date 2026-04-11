import { type FieldValues, type Path, type UseFormReturn, Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export function FormSelect<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = 'Pilih...',
  options,
  disabled,
  className,
}: FormSelectProps<T>) {
  const error = form.formState.errors[name];

  return (
    <div className={className}>
      <Label htmlFor={name}>{label}</Label>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select value={field.value as string} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger id={name}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error.message as string}</p>}
    </div>
  );
}
