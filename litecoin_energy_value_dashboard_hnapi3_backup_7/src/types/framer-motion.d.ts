declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    variants?: any;
    whileHover?: any;
    whileTap?: any;
    whileDrag?: any;
    whileFocus?: any;
    whileInView?: any;
    viewport?: any;
    drag?: any;
    dragConstraints?: any;
    dragElastic?: any;
    dragMomentum?: any;
    layout?: any;
    layoutId?: any;
    onAnimationStart?: any;
    onAnimationComplete?: any;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
  }

  type MotionComponent<P = {}> = React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P & MotionProps> & React.RefAttributes<any>
  >;

  export const motion: {
    div: MotionComponent<React.HTMLAttributes<HTMLDivElement>>;
    span: MotionComponent<React.HTMLAttributes<HTMLSpanElement>>;
    button: MotionComponent<React.ButtonHTMLAttributes<HTMLButtonElement>>;
    a: MotionComponent<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
    img: MotionComponent<React.ImgHTMLAttributes<HTMLImageElement>>;
    svg: MotionComponent<React.SVGProps<SVGSVGElement>>;
    path: MotionComponent<React.SVGAttributes<SVGPathElement>>;
    circle: MotionComponent<React.SVGAttributes<SVGCircleElement>>;
    ul: MotionComponent<React.HTMLAttributes<HTMLUListElement>>;
    li: MotionComponent<React.HTMLAttributes<HTMLLIElement>>;
    header: MotionComponent<React.HTMLAttributes<HTMLElement>>;
    section: MotionComponent<React.HTMLAttributes<HTMLElement>>;
    nav: MotionComponent<React.HTMLAttributes<HTMLElement>>;
    p: MotionComponent<React.HTMLAttributes<HTMLParagraphElement>>;
    h1: MotionComponent<React.HTMLAttributes<HTMLHeadingElement>>;
    h2: MotionComponent<React.HTMLAttributes<HTMLHeadingElement>>;
    h3: MotionComponent<React.HTMLAttributes<HTMLHeadingElement>>;
    h4: MotionComponent<React.HTMLAttributes<HTMLHeadingElement>>;
  } & any;

  export interface AnimatePresenceProps {
    children?: React.ReactNode;
    initial?: boolean;
    exitBeforeEnter?: boolean;
    presenceAffectsLayout?: boolean;
    mode?: 'sync' | 'wait' | 'popLayout';
    onExitComplete?: () => void;
  }
  export const AnimatePresence: React.FC<AnimatePresenceProps>;

  export function useAnimation(): any;
  export function useMotionValue<T>(initial: T): any;
  export function useTransform<T>(input: any, transform: (v: any) => T): any;
  export function useTransform<T>(input: any, inputRange: number[], outputRange: T[], options?: any): any;
  export function useScroll(options?: any): any;
  export function useInView(ref: React.RefObject<Element>, options?: any): boolean;
  export function useSpring(source: any, config?: any): any;
}
