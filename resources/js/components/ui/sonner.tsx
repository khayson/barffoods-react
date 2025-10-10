import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      toastOptions={{
        style: {
          background: '#111827',
          border: '1px solid #374151',
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
        classNames: {
          toast: 'bg-gray-900 border border-gray-700 text-white',
          title: 'text-white font-semibold',
          description: 'text-gray-300',
          actionButton: 'bg-white text-gray-900 hover:bg-gray-100',
          cancelButton: 'bg-gray-700 text-white hover:bg-gray-600',
          closeButton: 'text-gray-400 hover:text-white',
          error: 'bg-red-900 border-red-700',
          success: 'bg-green-900 border-green-700',
          warning: 'bg-yellow-900 border-yellow-700',
          info: 'bg-blue-900 border-blue-700',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
