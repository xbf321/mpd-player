import clsx from 'clsx';
export default function Button({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode | string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        'focus:outline-none',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:text-blue-700',
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
