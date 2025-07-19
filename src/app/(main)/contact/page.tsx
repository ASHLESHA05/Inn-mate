import React from "react";
import { Facebook, Twitter, Instagram, Mail, Phone } from "lucide-react";

function Contact() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center py-12 px-4">
      <div className="container mx-auto max-w-4xl bg-white shadow-md rounded-lg p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">Contact Us</h1>

        <p className="text-center text-gray-600 mb-10">
          We&apos;d love to hear from you! Whether you have a question, feedback, or need assistance, reach out to us.
        </p>

        {/* Contact Form */}
        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">Name</label>
            <input type="text" id="name" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500" placeholder="Your name" required />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">Email</label>
            <input type="email" id="email" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500" placeholder="Your email" required />
          </div>

          <div>
            <label htmlFor="subject" className="block text-gray-700 font-semibold mb-2">Subject</label>
            <input type="text" id="subject" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500" placeholder="Subject" required />
          </div>

          <div>
            <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">Message</label>
            <textarea id="message" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500" placeholder="Your message" required></textarea>
          </div>

          <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
            Send Message
          </button>
        </form>

        {/* Contact Information */}
        <div className="mt-10 text-center">
          <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
          <div className="flex flex-col items-center mt-4 space-y-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail className="text-blue-600" />
              <span>contact@innmate.com</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="text-blue-600" />
              <span>+1 234 567 890</span>
            </div>
            <div className="flex space-x-4 mt-4">
              <a href="https://facebook.com" className="text-gray-500 hover:text-blue-600"><Facebook /></a>
              <a href="https://twitter.com" className="text-gray-500 hover:text-blue-600"><Twitter /></a>
              <a href="https://instagram.com" className="text-gray-500 hover:text-pink-600"><Instagram /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
