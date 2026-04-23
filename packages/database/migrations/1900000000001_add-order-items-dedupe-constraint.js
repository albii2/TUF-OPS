exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addConstraint('order_items', 'order_items_order_raw_unique', {
    unique: ['order_id', 'source_raw_row_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('order_items', 'order_items_order_raw_unique');
};
