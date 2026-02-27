"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  imageUrl?: string | null;
}

interface SearchableComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  onSearchChange?: (search: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function SearchableCombobox({
  options,
  value,
  onValueChange,
  onSearchChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  isLoading = false,
  disabled = false,
  clearable = false,
  className,
  triggerClassName,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selected = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selected?.imageUrl !== undefined && (
              selected.imageUrl ? (
                <img src={selected.imageUrl} alt="" className="h-5 w-5 shrink-0 rounded object-cover" />
              ) : selected.imageUrl === null ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted">
                  <ImageIcon className="h-3 w-3 text-muted-foreground" />
                </span>
              ) : null
            )}
            <span className="truncate">{selected ? selected.label : placeholder}</span>
          </span>
          <div className="ml-2 flex shrink-0 items-center gap-1">
            {clearable && value && (
              <X
                className="h-3.5 w-3.5 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onValueChange("");
                  onSearchChange?.("");
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0", className)}
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command shouldFilter={!onSearchChange}>
          <CommandInput
            placeholder={searchPlaceholder}
            onValueChange={(search) => onSearchChange?.(search)}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label, option.sublabel ?? ""]}
                      onSelect={(currentValue) => {
                        onValueChange(currentValue === value ? "" : currentValue);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-1 items-center gap-2 overflow-hidden">
                        {option.imageUrl !== undefined && (
                          option.imageUrl ? (
                            <img src={option.imageUrl} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                          ) : (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted">
                              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </span>
                          )
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="truncate">{option.label}</span>
                          {option.sublabel && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {option.sublabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4 shrink-0",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
