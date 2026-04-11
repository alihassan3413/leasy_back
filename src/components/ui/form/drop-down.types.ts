export interface DropDownOption<T = string> {
  value: T
  label: string
}

export interface DropDownProps<T = string> {
  modelValue?: T | ''
  label?: string
  forId?: string
  required?: boolean
  options: DropDownOption<T>[]
  placeholder?: string
  inputClasses?: string
  labelClasses?: string
  disabled?: boolean
  error?: string
}