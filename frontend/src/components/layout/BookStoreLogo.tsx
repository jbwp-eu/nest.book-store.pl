import { cn } from "@/lib/utils";

type BookStoreLogoProps = {
  className?: string;
};

/** Same open-book mark as gql.book-store.com.pl, scaled down and in gray. */
function BookStoreLogo({ className }: BookStoreLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512.032 512.032"
      fill="none"
      aria-hidden
      className={cn("size-8 shrink-0", className)}
    >
      <rect
        x="83.368"
        y="24.32"
        width="324.672"
        height="86"
        className="fill-neutral-300 dark:fill-neutral-600"
      />
      <path
        className="fill-neutral-400 dark:fill-neutral-500"
        d="M432.712,102.624c-5.728-7.36-19.232-30.96,0.816-70.624h12.528V0H124.712 c-37.04,0-67.184,30.208-67.184,67.312v358.24c0,30.288,8.352,53.376,24.832,68.608c17.584,16.272,38.32,17.872,45.408,17.872 c1.328,0,2.192-0.048,2.448-0.08h324.288V102.624H432.712z M124.712,102.624c-19.392,0-35.184-15.84-35.184-35.312 S105.304,32,124.712,32h273.872c-11.6,30.4-8.432,54.24-2.016,70.624H124.712z"
      />
      <path
        className="fill-neutral-500 dark:fill-neutral-400"
        d="M432.712,102.624c-5.728-7.36-19.232-30.96,0.816-70.624h12.528V0H124.712 c-37.04,0-67.184,30.208-67.184,67.312v358.24c0,30.288,8.352,53.376,24.832,68.608c17.584,16.272,38.32,17.872,45.408,17.872 c1.328,0,2.192-0.048,2.448-0.08h324.288V102.624H432.712z M124.712,102.624c-19.392,0-35.184-15.84-35.184-35.312 S105.304,32,124.712,32h273.872c-11.6,30.4-8.432,54.24-2.016,70.624H124.712z"
      />
    </svg>
  );
}

export default BookStoreLogo;
