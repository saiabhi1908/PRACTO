import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const RelatedDoctors = ({ speciality, docId }) => {
  const navigate = useNavigate()
  const { doctors } = useContext(AppContext)
  const [relDoc, setRelDoc] = useState([])

  useEffect(() => {
    console.log('Doctors:', doctors)
    console.log('Speciality:', speciality)
    console.log('docId:', docId)

    if (doctors.length > 0 && speciality) {
      const specialityLower = speciality.toLowerCase()

      const doctorsData = doctors.filter((doc) => {
        if (doc._id === docId) return false

        const specs = doc.speciality || doc.specialization || []

        let specArray = []
        if (Array.isArray(specs)) {
          specArray = specs
        } else if (typeof specs === 'string') {
          specArray = specs.split(',').map(s => s.trim())
        }

        return specArray.some(s => s.toLowerCase() === specialityLower)
      })

      setRelDoc(doctorsData)
    } else {
      setRelDoc([])
    }
  }, [doctors, speciality, docId])

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-[#262626]'>
      <h1 className='text-3xl font-medium'>Related Doctors</h1>
      <p className='sm:w-1/3 text-center text-sm'>Simply browse through our extensive list of trusted doctors.</p>
      <div className='w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
        {relDoc.length > 0 ? (
          relDoc.map((item, index) => (
            <div
              onClick={() => {
                navigate(`/appointment/${item._id}`)
                scrollTo(0, 0)
              }}
              className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
              key={index}
            >
              <img className='bg-[#EAEFFF]' src={item.image} alt={item.name} />
              <div className='p-4'>
                <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                  <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p>
                  <p>{item.available ? 'Available' : "Not Available"}</p>
                </div>
                <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
                <p className='text-[#5C5C5C] text-sm'>
                  {Array.isArray(item.speciality) ? item.speciality.join(', ') : item.speciality || item.specialization}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className='text-gray-500'>No related doctors found.</p>
        )}
      </div>
    </div>
  )
}

export default RelatedDoctors
