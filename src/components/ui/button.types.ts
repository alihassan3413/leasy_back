export type ButtonVariant = 'primary' | 'secondary' | 'outline'

export type ButtonSize = 'sm' | 'md' | 'lg'

export type IconPosition = 'left' | 'right'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconPosition?: IconPosition
  buttonClasses?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}