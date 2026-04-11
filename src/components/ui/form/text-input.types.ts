export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel'

export interface TextInputProps {
  modelValue?: string
  label?: string
  forId?: string
  required?: boolean
  placeholder?: string
  inputClasses?: string
  labelClasses?: string
  type?: InputType
  showPasswordToggle?: boolean
  disabled?: boolean
  error?: string
}