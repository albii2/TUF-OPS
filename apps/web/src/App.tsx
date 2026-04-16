import React, { useEffect, useState } from 'react';

interface Organization {
  id: number;
  name: string;
}

function App() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/organizations')
      .then((response) => response.json())
      .then((data) => setOrganizations(data));
  }, []);

  return (
    <div>
      <h1>Organizations</h1>
      <ul>
        {organizations.map((org) => (
          <li key={org.id}>{org.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
