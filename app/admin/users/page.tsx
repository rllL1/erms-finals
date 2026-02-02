import { getStudents, getTeachers } from '@/lib/actions/admin'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const [studentsResult, teachersResult] = await Promise.all([
    getStudents(),
    getTeachers(),
  ])

  return (
    <UsersClient 
      initialStudents={studentsResult.data || []}
      initialTeachers={teachersResult.data || []}
      studentsError={studentsResult.error}
      teachersError={teachersResult.error}
    />
  )
}
