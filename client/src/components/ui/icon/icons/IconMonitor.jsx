const IconMonitor = ({color, size, strokeWidth, className}) => {

    const clr = color ? color : 'currentColor';

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || "32"} height={size || "32"} viewBox="0 0 32 32" fill={clr} strokeWidth={strokeWidth} className={className}>
            <path d="M27 5H5C3.34315 5 2 6.34315 2 8V20C2 21.6569 3.34315 23 5 23H13.5V25.5H10C9.44772 25.5 9 25.9477 9 26.5C9 27.0523 9.44772 27.5 10 27.5H22C22.5523 27.5 23 27.0523 23 26.5C23 25.9477 22.5523 25.5 22 25.5H18.5V23H27C28.6569 23 30 21.6569 30 20V8C30 6.34315 28.6569 5 27 5ZM4 8C4 7.44772 4.44772 7 5 7H27C27.5523 7 28 7.44772 28 8V18H4V8ZM27 21H5C4.44772 21 4 20.5523 4 20V20H28V20C28 20.5523 27.5523 21 27 21Z" />
        </svg>
    )
}

export default IconMonitor