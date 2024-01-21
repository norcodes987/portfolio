import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import toast, { Toaster } from "react-hot-toast";
import { styles } from "../styles";
import { SectionWrapper } from "../hoc";
import { slideIn } from "../utils/motion";

const Contact = () => {
  const formRef = useRef();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Validate the field
    if (name === "email") {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      setIsValidEmail(value.trim() !== "" && emailRegex.test(value));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isValidEmail) {
      setLoading(true);

      emailjs
        .send(
          import.meta.env.VITE_SERVICE_ID,
          import.meta.env.VITE_TEMPLATE_ID,
          {
            from_name: form.name,
            to_name: "Eleanor",
            from_email: form.email,
            to_email: "eleanortay97@gmail.com",
            message: form.message,
          },
          import.meta.env.VITE_PUBLIC_KEY
        )
        .then(() => {
          setLoading(false);
          toast.success(
            "Thank you! I will get back to you as soon as possible"
          );

          setForm(
            {
              name: "",
              email: "",
              message: "",
            },
            (error) => {
              setLoading(false);
              console.log(error);
              toast.error("Something went wrong.");
            }
          );
        });
    } else {
      toast.error("Please enter a valid email");
    }
  };

  return (
    <section className="relative w-full h-screen mx-auto">
      <div className="xl:mt-12 flex-row flex-col-reverse flex gap-10 overflow-hidden">
        <Toaster
          toastOptions={{
            style: {
              marginTop: 100,
              width: 300,
              textAlign: "center",
            },
          }}
        />
        <motion.div
          variants={slideIn("left", "tween", 0.2, 1)}
          className="flex-[0.75] bg-black-100 p-8 rounded-2xl"
        >
          <p className={styles.sectionSubText}>Get in touch</p>
          <h3 className={styles.sectionHeadText}>Contact.</h3>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="mt-12 flex flex-col gap-8"
          >
            <label className="flex flex-col">
              <span className="text-white font-medoim mb-4">Name</span>
              <input
                required
                text="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder=""
                className="bg-tertiary py-4 px-6 placeholder:text-secondary
              text-white rounded-lg outlined-none border-none font-medium"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-white font-medoim mb-4">Email</span>
              <input
                required
                text="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder=""
                className="bg-tertiary py-4 px-6 placeholder:text-secondary
              text-white rounded-lg outlined-none border-none font-medium"
              />
            </label>

            <label className="flex flex-col">
              <span className="text-white font-medoim mb-4">Message</span>
              <textarea
                required
                rows="7"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder=""
                className="bg-tertiary py-4 px-6 placeholder:text-secondary
              text-white rounded-lg outlined-none border-none font-medium"
              />
            </label>

            <button
              type="submit"
              className="bg-tertiary py-3 px-8 outline-none w-fit text-white font-bold
            shadow-md shadow-primary rounded-xl"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default SectionWrapper(Contact, "contact");
