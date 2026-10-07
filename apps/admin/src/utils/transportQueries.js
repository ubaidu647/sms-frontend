/** Every cached query that lists routes (the list page and the pickers). */
export const ROUTE_QUERY_KEYS = ['routes', 'routes-dropdown', 'routes-assignment-dropdown'];

/** Every cached query that lists or shows vehicles (the list page and the pickers). */
export const VEHICLE_QUERY_KEYS = [
  'vehicles',
  'vehicles-dropdown',
  'vehicles-route-dropdown',
  'vehicles-dropdown-assign',
  'vehicle-detail',
];

/** After a route create / update / delete, refetch the list and every route picker. */
export function invalidateRouteQueries(queryClient) {
  for (const key of ROUTE_QUERY_KEYS) queryClient.invalidateQueries({ queryKey: [key] });
}

/** After a vehicle create / edit / retire, refetch the list and every vehicle picker. */
export function invalidateVehicleQueries(queryClient) {
  for (const key of VEHICLE_QUERY_KEYS) queryClient.invalidateQueries({ queryKey: [key] });
}
