
import React from 'react';

const ContactPage: React.FC = () => {
    // The user requested to embed the form from:
    // https://docs.google.com/forms/d/1-HNVAuudEsZgOahoSlcyumPHDF4oUoH2cZ_uiO5p1co/preview
    // To embed a Google Form, the URL is typically modified to end with '/viewform?embedded=true'.
    // Note: Editor preview links often cannot be embedded due to security policies (X-Frame-Options).
    // A public "embed" link from the form's "Send" dialog is required for it to work correctly.
    const formUrl = "https://docs.google.com/forms/d/1-HNVAuudEsZgOahoSlcyumPHDF4oUoH2cZ_uiO5p1co/viewform?embedded=true";

    return (
        <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-5xl font-cinzel font-bold text-center mb-4 text-amber-900 text-shadow">Reach the Council</h1>
            <p className="text-center text-lg text-stone-600 mb-12">
                We are here to assist you on your quest. Send us a message.
            </p>

            <div className="bg-white/50 p-1 sm:p-2 rounded-lg shadow-md border border-amber-200" style={{ height: '90vh', minHeight: '700px' }}>
                <iframe
                    src={formUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    marginHeight={0}
                    marginWidth={0}
                    title="Contact Us Form"
                >
                    Loading…
                </iframe>
            </div>
        </div>
    );
};

export default ContactPage;
