import React from 'react';
import * as Lucide from 'lucide-react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: keyof typeof Lucide;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, className, ...props }) => {
  const LucideIcon = Lucide[name] as React.ElementType;
  if (!LucideIcon) return null;
  return <LucideIcon size={size} className={className} {...props} />;
};
