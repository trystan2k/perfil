import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden shadow-sm bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
        <img src="/favicon.png" alt="Perfil Logo" className="w-full h-full object-cover" />
      </div>
      {showText && (
        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Perfil
        </span>
      )}
    </div>
  );
}
