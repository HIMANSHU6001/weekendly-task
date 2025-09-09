import * as React from "react";

const SVGComponent = ({className}: { className: string }) => (
  <svg
    fill="none"
    width="800px"
    height="800px"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M21,11c-2.25,0-2.25,2-4.5,2S14.25,11,12,11,9.75,13,7.5,13,5.25,11,3,11"
      stroke="#f87171"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
    />
    <path
      d="M3,5C5.25,5,5.25,7,7.5,7S9.75,5,12,5s2.26,2,4.51,2S18.75,5,21,5"
      stroke="#fbbf24"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
    />
    <path
      d="M21,17c-2.25,0-2.25,2-4.5,2S14.25,17,12,17,9.75,19,7.5,19,5.25,17,3,17"
      stroke="#34d399"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
    />
  </svg>
);
export default SVGComponent;
