export type INode =
  {
    type: 'Erase' | 'Root',
    ports: [string]
  } |
  {
    type: 'Dup' | 'Lam' | 'App',
    ports: [string, string, string]
  };

export type INet = INode[];
