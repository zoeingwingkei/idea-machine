import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export interface SlotCategory {
  category: string;
  items: string[];
}

export function SlotSelectMenu({
  categories,
  open,
  onOpenChange,
  onSelect,
  children,
}: {
  categories: SlotCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: string) => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="max-h-[60vh] w-56 border-[#EECC6D]/40 bg-[#141210] text-white shadow-[0_0_24px_rgba(238,204,109,0.15)]"
      >
        {categories.map((cat) => (
          <DropdownMenuSub key={cat.category}>
            <DropdownMenuSubTrigger
              className="data-[state=open]:bg-[#EECC6D]/15 data-[state=open]:text-[#EECC6D] focus:bg-[#EECC6D]/15 focus:text-[#EECC6D]"
              style={{ fontFamily: "'Arvo', sans-serif" }}
            >
              {cat.category}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-[50vh] overflow-y-auto border-[#EECC6D]/40 bg-[#141210] text-white">
              {cat.items.map((item) => (
                <DropdownMenuItem
                  key={item}
                  className="focus:bg-[#EECC6D]/15 focus:text-[#EECC6D]"
                  style={{ fontFamily: "'Arvo', sans-serif" }}
                  onSelect={() => onSelect(item)}
                >
                  {item}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
