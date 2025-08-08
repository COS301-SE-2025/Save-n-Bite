import React from 'react';
import { Link } from 'react-router-dom';
import SingleRelatedItem from './SingleRelatedItem';

const RelatedItems = ({ items }) => (
  <div className="mt-12">
    <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
      You may also like
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <Link to={`/item/${item.id}`} key={item.id} className="block">
          <SingleRelatedItem item={item} />
        </Link>
      ))}
    </div>
  </div>
);

export default RelatedItems;