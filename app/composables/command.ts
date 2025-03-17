import type { Component } from 'vue'

export type CommandHandler<T = void> = (arg: T) => void

interface CommandCategory {
  name: string
  id: string
  type: 'category'
}

interface CommandOption {
  name: string
  id: string
  type: 'option'
  isActive: boolean
  action: () => void
  icon: Component
}

export type Command = CommandCategory | CommandOption
