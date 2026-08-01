import { ArrowIcon } from './icons';

export default function SplitButton({ href, variant = 'ghost', children, ...rest }) {
  return (
    <a href={href} className={`split-btn ${variant}`} {...rest}>
      <span className="label">{children}</span>
      <span className="arrow">
        <ArrowIcon />
      </span>
    </a>
  );
}
