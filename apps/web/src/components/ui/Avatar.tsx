import Image from "next/image";
import * as React from "react";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

type AvatarImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "width" | "height" | "src" | "srcSet" | "srcset"
> & { alt: string; src?: string };

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, alt, src, ...props }, ref) => {
    if (!src) return null;
    // `fill` fits the sized, relative parent Avatar. Sources can be arbitrary
    // user-provided URLs without configured remote patterns, so the image is
    // served as-is (`unoptimized`) instead of going through the optimizer.
    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        fill
        unoptimized
        className={cn("aspect-square h-full w-full object-cover", className)}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
      {...props}
    />
  )
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
