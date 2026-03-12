import React from 'react';

const Header = ({ category, title }) => (
  <div className="mb-4">
    {category && <p className="text-sm text-gray-400">{category}</p>}
    {title && <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-gray-200">{title}</h3>}
  </div>
);

export default Header;
