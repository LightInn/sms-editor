import * as v from 'valibot'

// Validation schema for contact form
export const ContactFormSchema = v.object({
	email: v.pipe(v.string('Email is required'), v.email('Please enter a valid email address')),
	message: v.pipe(
		v.string('Message is required'),
		v.minLength(10, 'Message must be at least 10 characters long'),
		v.maxLength(2000, 'Message must be less than 2000 characters')
	),
	storyLink: v.optional(v.pipe(v.string(), v.url('Please enter a valid URL'))),
})

export type ContactFormData = v.InferOutput<typeof ContactFormSchema>
