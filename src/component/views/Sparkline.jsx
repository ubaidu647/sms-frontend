import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function Sparkline({
  data,
  stroke = '#10b981',
  fill = 'rgba(16,185,129,0.15)',
  height = 80,
  width = 280,
  strokeWidth = 2,
}) {
  if (!data?.length) return <View style={{ height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1 || 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y];
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');

  const fillPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <View style={{ width: '100%', height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Path d={fillPath} fill={fill} />
        <Path d={linePath} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
