export type Primitive = null | string | number | boolean;
export type JSONValue =
  | Primitive
  | Record<string, JSONValue>
  | Array<JSONValue>;

export type Mask = boolean | Record<string, Mask>;

export type ShelfVersion = number | null;
export type ShelfValue = Primitive | Array<JSONValue> | ShelfObject;
export type ShelfObject = Record<string, Shelf>;
export type Shelf = [ShelfValue | Shelf, ShelfVersion];

export type ObjectMapper = (pair: [string, any]) => [string, any];
export type ObjectFilter = (pair: [string, any]) => boolean;

export as namespace Global;
