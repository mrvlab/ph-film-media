type TicketButtonProps = {
  bgColor?: string;
  textColor?: string;
  label?: string;
};

const TicketButton = ({
  bgColor = 'var(--bgColor-white)',
  textColor = 'var(--color-white)',
  label = 'Biljett',
}: TicketButtonProps) => {
  return (
    <div
      className='relative flex items-center justify-center h-full px-8  text-b-14 font-semibold'
      style={{ color: textColor }}
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 118 51'
        className='absolute inset-0 w-full h-[4.3rem] lg:h-[5.1rem]'
        preserveAspectRatio='xMidYMid meet'
      >
        <g clipPath='url(#a)'>
          <path
            fill={bgColor}
            fillOpacity='.9'
            d='M117.35 46.5437V4.45631c-1.182 0-2.315-.4695-3.151-1.30522-.836-.83572-1.305-1.9692-1.305-3.15109H4.45633c0 1.18189-.46951 2.31537-1.30523 3.15109C2.31537 3.98681 1.18189 4.45631 0 4.45631V46.5437c1.18189 0 2.31537.4695 3.1511 1.3052.83572.8357 1.30523 1.9692 1.30523 3.1511H112.894c0-1.1819.469-2.3154 1.305-3.1511.836-.8357 1.969-1.3052 3.151-1.3052Z'
          />
          <path
            stroke={bgColor}
            strokeOpacity='.9'
            d='M112.419.5c.115 1.13083.616 2.194 1.427 3.00488.81.81058 1.873 1.31012 3.004 1.42481V46.0693c-1.131.1147-2.194.6152-3.004 1.4258-.811.8109-1.312 1.8741-1.427 3.0049H4.93066c-.11463-1.1308-.6149-2.194-1.42578-3.0049C2.69401 46.6842 1.63082 46.184.5 46.0693V4.92969c1.13078-.11466 2.19403-.61396 3.00488-1.42481C4.31576 2.69401 4.81603 1.63082 4.93066.5H112.419Z'
          />
        </g>
        <g clipPath='url(#b)'>
          <path
            stroke={bgColor}
            strokeDasharray='2.02 2.02'
            strokeOpacity='.9'
            strokeWidth='.504202'
            d='M117.496 4.4563v42.0874'
          />
        </g>
        <defs>
          <clipPath id='a'>
            <path fill={bgColor} d='M0 0h117.35v51H0z' />
          </clipPath>
          <clipPath id='b'>
            <path fill={bgColor} d='M117 4.4563h.990295v42.0874H117z' />
          </clipPath>
        </defs>
      </svg>

      <span className='relative z-10 w-full h-fit'>{label}</span>
    </div>
  );
};

export default TicketButton;
