export function distance2D(point1, point2) {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

export function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

export function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

export function computeCentroid(points) {
  const x = points.reduce((acc, point) => acc + point.x, 0) / points.length;
  const y = points.reduce((acc, point) => acc + point.y, 0) / points.length;
  const z = points.reduce((acc, point) => acc + point.z, 0) / points.length;
  return { x, y, z };
}
