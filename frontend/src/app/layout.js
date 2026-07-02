import './globals.css';


export const metadata = {
  title: 'ONRC Companii',
  description: 'Cautare companii inregistrate la ONRC',
};


export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
