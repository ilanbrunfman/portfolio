// Six dots in two columns: a "grip" for drag handles (e.g. reordering a list)
const IconDotsSixVertical = ({color, size, strokeWidth, className}) => {

    const clr = color ? color : 'currentColor';

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || "32"} height={size || "32"} viewBox="0 0 32 32" fill={clr} strokeWidth={strokeWidth} className={className}>
            <circle cx="11.5" cy="8" r="2" />
            <circle cx="20.5" cy="8" r="2" />
            <circle cx="11.5" cy="16" r="2" />
            <circle cx="20.5" cy="16" r="2" />
            <circle cx="11.5" cy="24" r="2" />
            <circle cx="20.5" cy="24" r="2" />
        </svg>
    )
}
export default IconDotsSixVertical
